(*---
description: SANY reports E4350. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4350_Plus_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
While proof steps with explicit level can have names, proof steps with
implicit level (like <*> and <+>) cannot.
---- MODULE E4350_Plus_Test ----
THEOREM TRUE
PROOF
<+>a. QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 1 to line 13, col 5 of module E4350_Plus_Test
    | <*> and <+> cannot be used for a named step.
    3002:1 Parsing or semantic analysis failed.
---*)
