(*---
description: Evaluates a random bool expression, seed 262, number 7542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-Len(<<3, 1, 2>>)) \div (([x \in Nat |-> x + 1] @@ <<5, 6>>))[(1 * -1)]) < Head([[<<>> EXCEPT ![1] = 2] EXCEPT ![1] = ((1 :> 2))[2147483647]])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 84 to line 14, col 84 of module random_07542 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 82.
    | Expression starting at line 14, column 82.
    | ExtendableExpr starting at line 14, column 81.
    | Expression starting at line 14, column 81.
    | Some [] Form starting at line 14, column 80.
    | Fatal errors while parsing TLA+ spec in file random_07542
    | In module random_07542
    | Could not parse module random_07542 from file random_07542.tla
    | *** Errors: 1
    | In module random_07542
    | Could not parse module random_07542 from file random_07542.tla
    3002:1 Parsing or semantic analysis failed.
---*)
