(*---
description: A recursive parameter reaching a prime through a helper is also rejected.
ref: "tla2sany/semantic/ModuleNode.java#levelCheck"
features: [recursive]
outcome: parse-error
---*)
---- MODULE primes_through_helper ----
Pr(x) == x'
RECURSIVE F(_)
F(a) == Pr(a)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 13 of module primes_through_helper
    | Argument 1 of recursive operator F is primed
    3002:1 Parsing or semantic analysis failed.
---*)
