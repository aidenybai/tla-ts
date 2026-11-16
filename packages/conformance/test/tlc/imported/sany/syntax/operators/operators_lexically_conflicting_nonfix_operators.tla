(*---
description: Lexically-Conflicting Nonfix Operators. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/operators.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_lexically_conflicting_nonfix_operators ----
conflicts_with_octal == \o (1,2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 25 to line 9, col 26 of module operators_lexically_conflicting_nonfix_operators
    | Unknown operator: `\o'.
    3002:1 Parsing or semantic analysis failed.
---*)
