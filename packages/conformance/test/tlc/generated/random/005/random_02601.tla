(*---
description: Evaluates a random function expression, seed 262, number 2601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE {(7 * -1), (0 + -1)} -> (CHOOSE b4097 \in [b4098 \in Nat |-> b4098] : (~TRUE)) [] OTHER -> ((1 \div 3) % (3 - 0)) :> LET b4099 == ([b4100 \in 2..1 |-> b4100])[LET b4101 == 2 IN 0] IN (([x \in Nat |-> x + 1])[2] \div IF TRUE THEN 2 ELSE b4099)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 26 to line 14, col 26 of module random_02601 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 24.
    | Expression starting at line 14, column 24.
    | ExtendableExpr starting at line 14, column 23.
    | Expression starting at line 14, column 23.
    | Some { } form starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_02601
    | In module random_02601
    | Could not parse module random_02601 from file random_02601.tla
    | *** Errors: 1
    | In module random_02601
    | Could not parse module random_02601 from file random_02601.tla
    3002:1 Parsing or semantic analysis failed.
---*)
