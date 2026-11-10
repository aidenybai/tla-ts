(*---
description: SANY reports E4332. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4332_Set_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Label parameters are required if labels occur within the scope of bound
identifiers, but not identifiers introduced by operators.
---- MODULE E4332_Set_Test ----
op(x) == {y \in {} : lbl(x, y) :: TRUE}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 22 to line 11, col 38 of module E4332_Set_Test
    | Label lbl declares extra parameter(s)  x  
    3002:1 Parsing or semantic analysis failed.
---*)
