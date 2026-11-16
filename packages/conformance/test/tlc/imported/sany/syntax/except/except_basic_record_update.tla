(*---
description: Basic record update. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/except.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE except_basic_record_update ----
r == [a EXCEPT ![2] = "a"]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module except_basic_record_update
    | Unknown operator: `a'.
    3002:1 Parsing or semantic analysis failed.
---*)
