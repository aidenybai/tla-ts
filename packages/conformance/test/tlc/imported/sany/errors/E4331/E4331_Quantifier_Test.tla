(*---
description: SANY reports E4331. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4331_Quantifier_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Label parameters are required if labels occur within the scope of bound
identifiers; all bound parameters must be captured and their names must
match. Missing a parameter should be an error.
---- MODULE E4331_Quantifier_Test ----
op == \A x \in {} : lbl :: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 21 to line 12, col 31 of module E4331_Quantifier_Test
    | Label lbl must contain formal parameter `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
