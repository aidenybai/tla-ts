(*---
description: Evaluates a random int expression, seed 262, number 8025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((LET b12378 == 2 IN 3 .. (-3)) = DOMAIN [b12379 \in (1 :> 2) |-> <<1>>]) THEN (LET b12380 == (2147483647 + 2147483647) IN [<<1>> EXCEPT ![1] = 7] + LET b12381 == LET b12382 == 0 IN 0 IN (b12381 \div b12381)) ELSE (((TRUE :> -1))[(1 + 3)] + ((7 \div -1) % CASE TRUE -> 3 [] OTHER -> 3)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 264 to line 14, col 267 of module random_08025 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 262.
    | Expression starting at line 14, column 262.
    | ExtendableExpr starting at line 14, column 261.
    | Expression starting at line 14, column 261.
    | ExtendableExpr starting at line 14, column 260.
    | Fatal errors while parsing TLA+ spec in file random_08025
    | In module random_08025
    | Could not parse module random_08025 from file random_08025.tla
    | *** Errors: 1
    | In module random_08025
    | Could not parse module random_08025 from file random_08025.tla
    3002:1 Parsing or semantic analysis failed.
---*)
