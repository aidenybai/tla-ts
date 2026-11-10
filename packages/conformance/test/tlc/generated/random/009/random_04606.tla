(*---
description: Evaluates a random function expression, seed 262, number 4606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (<<3, 1, 2>> = (1 :> 2)) -> (7 + 3) [] OTHER -> SubSeq(<<1, 2>>, 0, 0) :> ((-1 :> 7))[(2147483647 * -1)]) @@ [[a |-> (7 + -1), b |-> (FALSE => TRUE)] EXCEPT !.a = @ + Cardinality(UNION {2..1, {2, 1, 3}})]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 121 to line 14, col 121 of module random_04606 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 110.
    | Expression starting at line 14, column 110.
    | ExtendableExpr starting at line 14, column 109.
    | Expression starting at line 14, column 109.
    | Some [] Form starting at line 14, column 108.
    | Fatal errors while parsing TLA+ spec in file random_04606
    | In module random_04606
    | Could not parse module random_04606 from file random_04606.tla
    | *** Errors: 1
    | In module random_04606
    | Could not parse module random_04606 from file random_04606.tla
    3002:1 Parsing or semantic analysis failed.
---*)
