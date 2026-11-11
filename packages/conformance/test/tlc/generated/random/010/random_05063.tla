(*---
description: Evaluates a random int expression, seed 262, number 5063.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05063 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((2147483647 \in {1, 2}) \/ (-1 = 2)) => (({1} \subseteq {2, 1, 3}) => (FALSE /\ FALSE))) -> [b7879 \in (DOMAIN <<5, 6>> \cup (2 .. 3)) |-> ([a |-> [a |-> 1], b |-> FALSE]).a] [] OTHER -> IF (IF <<3, 1, 2>> THEN 1 ELSE 2 < (3 \div -1)) THEN (CASE FALSE -> 0 [] OTHER -> -1 \div Len(<<1>>)) ELSE ((0 :> 3))[([a |-> 1, b |-> TRUE]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 248 to line 14, col 251 of module random_05063 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 246.
    | Expression starting at line 14, column 246.
    | ExtendableExpr starting at line 14, column 245.
    | ExtendableExpr starting at line 14, column 241.
    | Expression starting at line 14, column 241.
    | Fatal errors while parsing TLA+ spec in file random_05063
    | In module random_05063
    | Could not parse module random_05063 from file random_05063.tla
    | *** Errors: 1
    | In module random_05063
    | Could not parse module random_05063 from file random_05063.tla
    3002:1 Parsing or semantic analysis failed.
---*)
