(*---
description: Evaluates a random bool expression, seed 262, number 9499.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09499 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b14757 == (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))[([a |-> 1, b |-> TRUE]).a] IN (IF FALSE THEN b14757 ELSE b14757 + (CHOOSE b14758 \in {1} : FALSE)) = CASE (~(2147483647 \in Nat)) -> Head((<<3, 1, 2>> \o <<1, 2>>)) [] OTHER -> ((2147483647 \div -1) % (2147483647 :> 7))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 269 to line 14, col 272 of module random_09499 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 258.
    | Expression starting at line 14, column 258.
    | ExtendableExpr starting at line 14, column 257.
    | Expression starting at line 14, column 257.
    | ExtendableExpr starting at line 14, column 256.
    | Fatal errors while parsing TLA+ spec in file random_09499
    | In module random_09499
    | Could not parse module random_09499 from file random_09499.tla
    | *** Errors: 1
    | In module random_09499
    | Could not parse module random_09499 from file random_09499.tla
    3002:1 Parsing or semantic analysis failed.
---*)
