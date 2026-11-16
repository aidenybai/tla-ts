(*---
description: Single nested record update. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/except.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE except_single_nested_record_update ----
r == [a EXCEPT ![2]["a"][3] = @ + 1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 7 to line 9, col 7 of module except_single_nested_record_update
    | Unknown operator: `a'.
    | line 9, col 33 to line 9, col 33 of module except_single_nested_record_update
    | Could not find declaration or definition of symbol '+'.
    | line 9, col 31 to line 9, col 35 of module except_single_nested_record_update
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
