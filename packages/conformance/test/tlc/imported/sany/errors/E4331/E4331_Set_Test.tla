(*---
description: SANY reports E4331. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4331_Set_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Label parameters are required if labels occur within the scope of bound
identifiers; all bound parameters must be captured and their names must
match. Missing a parameter should be an error.
---- MODULE E4331_Set_Test ----
op == {x \in {} : lbl :: TRUE}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 19 to line 12, col 29 of module E4331_Set_Test
    | Label lbl must contain formal parameter `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
