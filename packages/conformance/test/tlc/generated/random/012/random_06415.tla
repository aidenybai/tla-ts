(*---
description: Evaluates a random function expression, seed 262, number 6415.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06415 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(LET b9876 == (2147483647 \div -1) IN CASE TRUE -> 7 [] OTHER -> 0 :> (([x \in Nat |-> x + 1])[-1] \div (<<5, 6>>)[2147483647])) EXCEPT ![LET b9877 == LET b9878 == IF TRUE THEN -1 ELSE 3 IN [[a |-> 1] EXCEPT !.a = b9878] IN Head(<<[a |-> 1, b |-> TRUE], 2147483647>>)] = ((CASE FALSE -> 2147483647 [] OTHER -> 2 * IF TRUE THEN 1 ELSE 7) * (-LET b9879 == 2147483647 IN 2147483647))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 43 to line 14, col 46 of module random_06415 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 32.
    | Expression starting at line 14, column 32.
    | ExtendableExpr starting at line 14, column 31.
    | Expression starting at line 14, column 31.
    | Definition starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_06415
    | In module random_06415
    | Could not parse module random_06415 from file random_06415.tla
    | *** Errors: 1
    | In module random_06415
    | Could not parse module random_06415 from file random_06415.tla
    3002:1 Parsing or semantic analysis failed.
---*)
