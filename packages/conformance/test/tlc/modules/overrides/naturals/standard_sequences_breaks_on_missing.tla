(*---
description: "The standard Sequences instances Naturals by name, so a replacing file without the operators it uses makes it fail."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Naturals.tla]
outcome: parse-error
---*)
---- MODULE standard_sequences_breaks_on_missing ----
EXTENDS Sequences
Test == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 22
    | line 20, col 20 to line 20, col 21 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 20, col 19 to line 20, col 22 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 25, col 42 to line 25, col 43 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 25, col 41 to line 25, col 44 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 30, col 19 to line 30, col 20 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 30, col 18 to line 30, col 37 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 30, col 48 to line 30, col 51 of module Sequences
    | Could not find declaration or definition of symbol '\leq'.
    | line 30, col 46 to line 30, col 58 of module Sequences
    | Couldn't resolve infix operator symbol `\leq'.
    | line 31, col 68 to line 31, col 68 of module Sequences
    | Could not find declaration or definition of symbol '-'.
    | line 31, col 67 to line 31, col 74 of module Sequences
    | Couldn't resolve infix operator symbol `-'.
    | line 42, col 38 to line 42, col 39 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 42, col 37 to line 42, col 49 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 48, col 28 to line 48, col 29 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 48, col 27 to line 48, col 36 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 48, col 47 to line 48, col 47 of module Sequences
    | Could not find declaration or definition of symbol '-'.
    | line 48, col 46 to line 48, col 48 of module Sequences
    | Couldn't resolve infix operator symbol `-'.
    | line 58, col 16 to line 58, col 17 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 58, col 15 to line 58, col 23 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 63, col 52 to line 63, col 52 of module Sequences
    | Could not find declaration or definition of symbol '-'.
    | line 63, col 51 to line 63, col 53 of module Sequences
    | Couldn't resolve infix operator symbol `-'.
    | line 64, col 45 to line 64, col 45 of module Sequences
    | Could not find declaration or definition of symbol '-'.
    | line 64, col 44 to line 64, col 46 of module Sequences
    | Couldn't resolve infix operator symbol `-'.
    | Semantic errors:
    | *** Errors: 22
    | line 20, col 20 to line 20, col 21 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 20, col 19 to line 20, col 22 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 25, col 42 to line 25, col 43 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 25, col 41 to line 25, col 44 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 30, col 19 to line 30, col 20 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 30, col 18 to line 30, col 37 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 30, col 48 to line 30, col 51 of module Sequences
    | Could not find declaration or definition of symbol '\leq'.
    | line 30, col 46 to line 30, col 58 of module Sequences
    | Couldn't resolve infix operator symbol `\leq'.
    | line 31, col 68 to line 31, col 68 of module Sequences
    | Could not find declaration or definition of symbol '-'.
    | line 31, col 67 to line 31, col 74 of module Sequences
    | Couldn't resolve infix operator symbol `-'.
    | line 42, col 38 to line 42, col 39 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 42, col 37 to line 42, col 49 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 48, col 28 to line 48, col 29 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 48, col 27 to line 48, col 36 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 48, col 47 to line 48, col 47 of module Sequences
    | Could not find declaration or definition of symbol '-'.
    | line 48, col 46 to line 48, col 48 of module Sequences
    | Couldn't resolve infix operator symbol `-'.
    | line 58, col 16 to line 58, col 17 of module Sequences
    | Could not find declaration or definition of symbol '..'.
    | line 58, col 15 to line 58, col 23 of module Sequences
    | Couldn't resolve infix operator symbol `..'.
    | line 63, col 52 to line 63, col 52 of module Sequences
    | Could not find declaration or definition of symbol '-'.
    | line 63, col 51 to line 63, col 53 of module Sequences
    | Couldn't resolve infix operator symbol `-'.
    | line 64, col 45 to line 64, col 45 of module Sequences
    | Could not find declaration or definition of symbol '-'.
    | line 64, col 44 to line 64, col 46 of module Sequences
    | Couldn't resolve infix operator symbol `-'.
    3002:1 Parsing or semantic analysis failed.
---*)
