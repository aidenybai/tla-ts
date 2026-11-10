(*---
description: Evaluates a random set expression, seed 262, number 5128.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05128 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF 2147483647 THEN 7 ELSE 7 - CASE FALSE -> -1 [] OTHER -> 0) .. (((1 :> 2) @@ [x \in Nat |-> x + 1]))[(2147483647 \div -1)]) \cap {b7975 \in {(<<5, 6>>)[2147483647], (0 \div 2147483647)} : (~([a |-> 1, b |-> TRUE] = [a |-> 1]))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 134 to line 14, col 137 of module random_05128 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 123.
    | Expression starting at line 14, column 123.
    | ExtendableExpr starting at line 14, column 122.
    | Expression starting at line 14, column 122.
    | Some [] Form starting at line 14, column 121.
    | Fatal errors while parsing TLA+ spec in file random_05128
    | In module random_05128
    | Could not parse module random_05128 from file random_05128.tla
    | *** Errors: 1
    | In module random_05128
    | Could not parse module random_05128 from file random_05128.tla
    3002:1 Parsing or semantic analysis failed.
---*)
