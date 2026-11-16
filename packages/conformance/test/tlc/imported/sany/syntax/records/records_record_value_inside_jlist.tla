(*---
description: Record Value Inside Jlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/records.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE records_record_value_inside_jlist ----
op ==
  /\ 1
  /\ foo.bar 

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 6 to line 11, col 8 of module records_record_value_inside_jlist
    | Unknown operator: `foo'.
    3002:1 Parsing or semantic analysis failed.
---*)
