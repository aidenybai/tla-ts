(*---
description: + has no meaning without Naturals.
ref: "tla2sany/semantic/Generator.java#generateGenID"
features: [operators]
outcome: parse-error
---*)
---- MODULE plus_needs_naturals ----
Test == (1 + 2) = 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 12 to line 8, col 12 of module plus_needs_naturals
    | Could not find declaration or definition of symbol '+'.
    | line 8, col 10 to line 8, col 14 of module plus_needs_naturals
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
