import { NextResponse } from "next/server";

import { listActiveGames } from "@/services/game.service";
import { listActiveStations } from "@/services/station.service";
import { listBookingDurations } from "@/services/pricing.service";
import { GENERIC_WHATSAPP_MESSAGE } from "@/lib/contact";

/**
 * GET /api/catalogue — minimal public catalogue for the booking wizard.
 *
 * Games/stations/durations come from the database through the services
 * layer (ARCHITECTURE.md §4). Nothing is hard-coded (RULES.md §2).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [games, stations, durations] = await Promise.all([
      listActiveGames(),
      listActiveStations(),
      listBookingDurations(),
    ]);

    return NextResponse.json({
      ok: true,
      games: games.map((game) => ({
        id: game.id,
        name: game.name,
        platform: game.platform,
        description: game.description,
        imageUrl: game.imageUrl,
        price: game.price,
      })),
      stations: stations.map((station) => ({
        id: station.id,
        name: station.name,
        consoleType: station.consoleType,
        status: station.status,
      })),
      durations,
      defaultWhatsAppMessage: GENERIC_WHATSAPP_MESSAGE,
    });
  } catch {
    console.error("[catalogue] unexpected error");
    return NextResponse.json(
      { ok: false, code: "SERVICE_UNAVAILABLE", message: "Catalogue could not be loaded. Try again." },
      { status: 503 },
    );
  }
}
