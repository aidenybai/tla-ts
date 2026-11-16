(*---
description: SANY reports E4313. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4313_LAnd_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Logical-And operator cannot have mixed action- & temporal-level parameters.
---- MODULE E4313_LAnd_Test ----
VARIABLE v
op == v' /\ []v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 15 of module E4313_LAnd_Test
    | \land has both temporal formula and action as arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
