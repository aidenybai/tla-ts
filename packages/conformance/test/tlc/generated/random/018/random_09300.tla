(*---
description: Evaluates a random record expression, seed 262, number 9300.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09300 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> <<CASE (FALSE /\ TRUE) -> (CHOOSE b14435 \in 1..3 : TRUE) [] OTHER -> (7 * -1), (-[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7])>>, b |-> (((3 \in 1..3) => (<<1, 2>> = <<5, 6>>)) \/ [a |-> (7 + -1), b |-> (<<1, 2>> = 2)])])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 96 to line 14, col 96 of module random_09300 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 94.
    | Expression starting at line 14, column 94.
    | ExtendableExpr starting at line 14, column 93.
    | Expression starting at line 14, column 93.
    | Case Other Arm starting at line 14, column 84.
    | Fatal errors while parsing TLA+ spec in file random_09300
    | In module random_09300
    | Could not parse module random_09300 from file random_09300.tla
    | *** Errors: 1
    | In module random_09300
    | Could not parse module random_09300 from file random_09300.tla
    3002:1 Parsing or semantic analysis failed.
---*)
