(*---
description: Nested Parentheses. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/expressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE expressions_nested_parentheses ----
op == ((((x))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 11 of module expressions_nested_parentheses
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
