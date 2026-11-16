(*---
description: Evaluates a random bool expression, seed 262, number 1491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (1 * -1)] EXCEPT !.a = (CHOOSE b2383 \in {b2384 \in (1 :> 2) : FALSE} : [<<1, 2>> EXCEPT ![1] = b2383])] = [[a |-> (7 % (1 :> 2)), b |-> ({x \in 1..3 : x > 1} = 7)] EXCEPT !.a = @ + (Head(<<1>>) \div (<<1>> \div 0))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 80 to line 14, col 80 of module random_01491 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 78.
    | Expression starting at line 14, column 78.
    | ExtendableExpr starting at line 14, column 77.
    | ExtendableExpr starting at line 14, column 73.
    | Expression starting at line 14, column 73.
    | Fatal errors while parsing TLA+ spec in file random_01491
    | In module random_01491
    | Could not parse module random_01491 from file random_01491.tla
    | *** Errors: 1
    | In module random_01491
    | Could not parse module random_01491 from file random_01491.tla
    3002:1 Parsing or semantic analysis failed.
---*)
