(*---
description: SANY reports E4333. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4333_Theorem_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Labels can only occur in operator definitions or proof steps.
---- MODULE E4333_Theorem_Test ----
THEOREM lbl :: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 9 to line 10, col 19 of module E4333_Theorem_Test
    | Label not in definition or proof step.
    3002:1 Parsing or semantic analysis failed.
---*)
