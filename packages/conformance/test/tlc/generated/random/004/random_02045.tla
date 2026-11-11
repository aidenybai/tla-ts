(*---
description: Evaluates a random record expression, seed 262, number 2045.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{((7 + 2147483647) \div IF TRUE THEN -1 ELSE [x \in Nat |-> x + 1]), ((<<5, 6>> @@ (1 :> 2)))[(1 - 2147483647)]} EXCEPT !.a = @ + LET b3250 == ((2 + FALSE) % LET b3251 == 3 IN 2) IN ((3 \div -1) + SelectSeq(<<1>>, LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 203 to line 14, col 206 of module random_02045 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 201.
    | Expression starting at line 14, column 201.
    | ExtendableExpr starting at line 14, column 200.
    | Expression starting at line 14, column 200.
    | ExtendableExpr starting at line 14, column 199.
    | Fatal errors while parsing TLA+ spec in file random_02045
    | In module random_02045
    | Could not parse module random_02045 from file random_02045.tla
    | *** Errors: 1
    | In module random_02045
    | Could not parse module random_02045 from file random_02045.tla
    3002:1 Parsing or semantic analysis failed.
---*)
