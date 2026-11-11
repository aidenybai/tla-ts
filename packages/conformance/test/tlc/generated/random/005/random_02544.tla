(*---
description: Evaluates a random function expression, seed 262, number 2544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b4012 \in {b4013 \in {x \in 1..3 : x > 1} : FALSE} : (<<>> = [x \in 1..2 |-> x])) * IF (FALSE \/ TRUE) THEN (2..1 \ 2..1) ELSE Head(<<1>>)) :> ((Len(<<1, 2>>) * (2147483647 \div -1)) + CASE (1 = -1) -> LET b4014 == -1 IN b4014 [] OTHER -> (FALSE <=> TRUE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 199 to line 14, col 202 of module random_02544 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 188.
    | Expression starting at line 14, column 188.
    | ExtendableExpr starting at line 14, column 187.
    | ExtendableExpr starting at line 14, column 171.
    | Expression starting at line 14, column 171.
    | Fatal errors while parsing TLA+ spec in file random_02544
    | In module random_02544
    | Could not parse module random_02544 from file random_02544.tla
    | *** Errors: 1
    | In module random_02544
    | Could not parse module random_02544 from file random_02544.tla
    3002:1 Parsing or semantic analysis failed.
---*)
