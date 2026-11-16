(*---
description: Step Expression Requiring Lookahead. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/step_expressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE step_expressions_step_expression_requiring_lookahead ----
Prop == [][x \in {1, 2}]_x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "]_" at line 9, column 24 and token "}" 
    | Residual stack trace follows:
    | Some [] Form starting at line 9, column 11.
    | ExtendableExpr starting at line 9, column 11.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file step_expressions_step_expression_requiring_lookahead
    | In module step_expressions_step_expression_requiring_lookahead
    | Could not parse module step_expressions_step_expression_requiring_lookahead from file step_expressions_step_expression_requiring_lookahead.tla
    | *** Errors: 1
    | In module step_expressions_step_expression_requiring_lookahead
    | Could not parse module step_expressions_step_expression_requiring_lookahead from file step_expressions_step_expression_requiring_lookahead.tla
    3002:1 Parsing or semantic analysis failed.
---*)
