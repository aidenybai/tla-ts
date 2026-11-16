(*---
description: SANY reports E4357. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4357_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
HIDE statements can only refer to theorems, assumptions, or proof steps.
---- MODULE E4357_Test ----
def == TRUE
HIDE def
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 6 to line 11, col 8 of module E4357_Test
    | The only expression allowed as a fact in a HIDE is 
    | the name of a theorem, assumption, or step.
    3002:1 Parsing or semantic analysis failed.
---*)
