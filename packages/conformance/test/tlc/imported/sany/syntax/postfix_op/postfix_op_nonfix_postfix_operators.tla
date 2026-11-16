(*---
description: Nonfix Postfix Operators. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/postfix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE postfix_op_nonfix_postfix_operators ----
op == {
  A!B!^+(x),
  A!B!^*(x),
  A!B!^#(x),
  A!B!'(x)
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 10, col 3 to line 10, col 8 of module postfix_op_nonfix_postfix_operators
    | Unknown operator: `A!B!^+'.
    | line 11, col 3 to line 11, col 8 of module postfix_op_nonfix_postfix_operators
    | Unknown operator: `A!B!^*'.
    | line 12, col 3 to line 12, col 8 of module postfix_op_nonfix_postfix_operators
    | Unknown operator: `A!B!^#'.
    | line 13, col 3 to line 13, col 7 of module postfix_op_nonfix_postfix_operators
    | Unknown operator: `A!B!''.
    3002:1 Parsing or semantic analysis failed.
---*)
