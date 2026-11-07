(*---
description: SANY reports E4335. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4335_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Labels are not permitted within function-except clauses.
---- MODULE E4335_Test ----
f[x \in {}] == x
op == [f EXCEPT ![0] = lbl :: 0]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 24 to line 11, col 31 of module E4335_Test
    | Labels inside EXCEPT clauses are not yet implemented.
    3002:1 Parsing or semantic analysis failed.
---*)
