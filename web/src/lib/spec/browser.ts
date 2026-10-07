"use client";

import packed from "@spec/browser";
import { unpackContract } from "@/api/contract";

export const browser = { ...packed, contract: unpackContract(packed.contract) };
