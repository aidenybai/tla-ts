(*---
description: SANY reports E4261. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4261_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
The @ symbol is used to refer to the previous function value when writing a
[f EXCEPT ![x] = @ + 1] function-except expression. Its use outside of that
context should generate an error.
---- MODULE E4261_Test ----
op == @
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 7 to line 12, col 7 of module E4261_Test
    | @ used where its meaning is not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
