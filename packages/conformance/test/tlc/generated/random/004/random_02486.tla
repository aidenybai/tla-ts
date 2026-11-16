(*---
description: Evaluates a random seq expression, seed 262, number 2486.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02486 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((((7 = 7) /\ (3 = 7)) => (~(\A b3911 \in {1} : [x \in Nat |-> x + 1]))), IF ([[a |-> 1] EXCEPT !.a = 2] = [a |-> 7, b |-> FALSE]) THEN CASE (7 \in {}) -> Head(<<3, 1, 2>>) [] OTHER -> (-1 % 0) ELSE ((2 \div -1) \div Head(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 225 to line 14, col 228 of module random_02486 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 223.
    | Expression starting at line 14, column 223.
    | ExtendableExpr starting at line 14, column 222.
    | Expression starting at line 14, column 222.
    | ExtendableExpr starting at line 14, column 221.
    | Fatal errors while parsing TLA+ spec in file random_02486
    | In module random_02486
    | Could not parse module random_02486 from file random_02486.tla
    | *** Errors: 1
    | In module random_02486
    | Could not parse module random_02486 from file random_02486.tla
    3002:1 Parsing or semantic analysis failed.
---*)
