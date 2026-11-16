(*---
description: Record Value. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/records.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE records_record_value ----
op == foo.bar
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 9 of module records_record_value
    | Unknown operator: `foo'.
    3002:1 Parsing or semantic analysis failed.
---*)
