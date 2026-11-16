(*---
description: Evaluates a random function expression, seed 262, number 4454.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04454 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{} -> {}] : TRUE) EXCEPT ![CASE (<<1, 2>> = (1 :> 2)) -> (1 % {x \in 1..3 : x > 1}) [] OTHER -> IF FALSE THEN 0 ELSE 0] = ((2 * -1) + Head(<<>>))] @@ (((0 + 3) * (-1 * {1, 2})) :> Len(Append(<<>>, 1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 159 to line 14, col 159 of module random_04454 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 157.
    | Expression starting at line 14, column 157.
    | ExtendableExpr starting at line 14, column 156.
    | Expression starting at line 14, column 156.
    | ExtendableExpr starting at line 14, column 155.
    | Fatal errors while parsing TLA+ spec in file random_04454
    | In module random_04454
    | Could not parse module random_04454 from file random_04454.tla
    | *** Errors: 1
    | In module random_04454
    | Could not parse module random_04454 from file random_04454.tla
    3002:1 Parsing or semantic analysis failed.
---*)
