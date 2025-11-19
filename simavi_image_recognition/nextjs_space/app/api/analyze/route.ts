
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFileSignedUrl } from "@/lib/s3";
import { generateNewFilename, extractExtension } from "@/lib/filename-generator";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return new Response(
      encoder.encode(JSON.stringify({ status: "error", message: "Image ID required" })),
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const image = await prisma.image.findUnique({
          where: { id: imageId },
        });

        if (!image) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: "error", message: "Image not found" })}\n\n`)
          );
          controller.close();
          return;
        }

        await prisma.image.update({
          where: { id: imageId },
          data: { analysisStatus: "processing" },
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: "processing", message: "Starting analysis..." })}\n\n`)
        );

        const signedUrl = await getFileSignedUrl(image.cloudStoragePath);
        const imageResponse = await fetch(signedUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64String = Buffer.from(imageBuffer).toString("base64");

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: "processing", message: "Analyzing image with Vision AI..." })}\n\n`)
        );

        const messages = [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${image.mimeType};base64,${base64String}`,
                },
              },
              {
                type: "text",
                text: `Analyze this image and provide the following information in JSON format:
{
  "objects": ["list of main objects, items, or subjects visible in the image"],
  "detectedText": "any text or writing visible in the image (OCR). If there are multiple signs or text elements, extract all of them.",
  "location": "if identifiable from visual landmarks or context, provide specific location name, otherwise null",
  "isLocationFromMetadata": false (IMPORTANT: always set to false since we cannot extract EXIF metadata from base64),
  "mainObject": "the PRIMARY object or subject in the image - this should be the object that is either centrally positioned OR occupies more than 50% of the image area",
  "isPrimaryObjectCentral": true/false (is the main object centrally positioned or occupying more than 50% of image),
  "isSign": true/false (is the main object a sign, placard, or contains text as its primary feature)
}

IMPORTANT RULES:
- The mainObject must be the most prominent object (central position OR >50% coverage)
- Set isSign to true if the main object is a sign, placard, traffic sign, street sign, billboard, or any object where text is the primary feature
- Extract ALL visible text in detectedText, not just from signs

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`,
              },
            ],
          },
        ];

        const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: messages,
            stream: true,
            max_tokens: 2000,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          throw new Error(`Vision API error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let partialRead = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          partialRead += decoder.decode(value, { stream: true });
          let lines = partialRead.split("\n");
          partialRead = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                const analysisResult = JSON.parse(buffer);

                const extension = extractExtension(image.originalName);
                const existingImagesCount = await prisma.image.count({
                  where: { analysisStatus: "completed" },
                });
                const newFilename = generateNewFilename(
                  analysisResult.location,
                  analysisResult.isLocationFromMetadata || false,
                  analysisResult.mainObject,
                  analysisResult.detectedText,
                  analysisResult.isSign || false,
                  existingImagesCount + 1,
                  extension
                );

                await prisma.image.update({
                  where: { id: imageId },
                  data: {
                    newName: newFilename,
                    objects: JSON.stringify(analysisResult.objects || []),
                    detectedText: analysisResult.detectedText || null,
                    location: analysisResult.location || null,
                    analysisStatus: "completed",
                  },
                });

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      status: "completed",
                      result: {
                        imageId: imageId,
                        newName: newFilename,
                        objects: analysisResult.objects || [],
                        detectedText: analysisResult.detectedText || "",
                        location: analysisResult.location || null,
                      },
                    })}\n\n`
                  )
                );
                return;
              }

              try {
                const parsed = JSON.parse(data);
                buffer += parsed.choices?.[0]?.delta?.content || "";
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ status: "processing", message: "Analyzing..." })}\n\n`
                  )
                );
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error("Analysis error:", error);
        await prisma.image.update({
          where: { id: imageId },
          data: {
            analysisStatus: "failed",
            analysisError: error instanceof Error ? error.message : "Unknown error",
          },
        });
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: "error", message: "Analysis failed" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
