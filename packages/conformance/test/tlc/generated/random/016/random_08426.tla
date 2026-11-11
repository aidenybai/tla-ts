(*---
description: Evaluates a random seq expression, seed 262, number 8426.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08426 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SortSeq(Tail(<<>>), LAMBDA p, q : p < q) \o Append(Tail(<<>>), LET b13044 == 2147483647 IN 0)) EXCEPT ![1] = (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]).a \div IF (\E b13045 \in {x \in 1..3 : x > 1} : FALSE) THEN CASE FALSE -> -1 [] OTHER -> 7 ELSE (-1 * -1))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 269 to line 14, col 269 of module random_08426 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 267.
    | Expression starting at line 14, column 266.
    | ExtendableExpr starting at line 14, column 265.
    | Expression starting at line 14, column 265.
    | IF THEN ELSE starting at line 14, column 176.
    | Fatal errors while parsing TLA+ spec in file random_08426
    | In module random_08426
    | Could not parse module random_08426 from file random_08426.tla
    | *** Errors: 1
    | In module random_08426
    | Could not parse module random_08426 from file random_08426.tla
    3002:1 Parsing or semantic analysis failed.
---*)
