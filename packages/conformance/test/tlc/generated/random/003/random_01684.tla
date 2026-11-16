(*---
description: Evaluates a random function expression, seed 262, number 1684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = Head(<<1, 2>>)]).a :> IF (Tail(<<>>) = [[x \in Nat |-> x + 1] EXCEPT ![2] = 3]) THEN ((1 \div 1) - (-1 * -1)) ELSE ([b2688 \in Nat |-> b2688])[(TRUE + 3)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 166 to line 14, col 166 of module random_01684 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 164.
    | Expression starting at line 14, column 163.
    | ExtendableExpr starting at line 14, column 162.
    | ExtendableExpr starting at line 14, column 149.
    | Expression starting at line 14, column 149.
    | Fatal errors while parsing TLA+ spec in file random_01684
    | In module random_01684
    | Could not parse module random_01684 from file random_01684.tla
    | *** Errors: 1
    | In module random_01684
    | Could not parse module random_01684 from file random_01684.tla
    3002:1 Parsing or semantic analysis failed.
---*)
