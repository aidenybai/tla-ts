(*---
description: SANY reports E4262. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4262_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
When constructing a record, two fields with the same name cannot be defined.
---- MODULE E4262_Test ----
rcd == [
  def |-> 0,
  def |-> 0
]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 3 to line 12, col 5 of module E4262_Test
    | Non-unique fields in constructor.
    3002:1 Parsing or semantic analysis failed.
---*)
