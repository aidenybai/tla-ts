(*---
description: Evaluates a random seq expression, seed 262, number 9871.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09871 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(IF (2..1 = {x \in 1..3 : x > 1}) THEN Head(<<1>>) ELSE (1 * 3) * (IF TRUE THEN 0 ELSE -1 \div (0 * -1))), LET b15335 == (LET b15336 == 3 IN 2 + (-1 + 0)) IN ([(1 :> 2) EXCEPT ![0] = 0])[Head(<<1, 2>>)]>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 116 to line 14, col 116 of module random_09871 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 114.
    | Expression starting at line 14, column 114.
    | ExtendableExpr starting at line 14, column 113.
    | ExtendableExpr starting at line 14, column 106.
    | Expression starting at line 14, column 105.
    | Fatal errors while parsing TLA+ spec in file random_09871
    | In module random_09871
    | Could not parse module random_09871 from file random_09871.tla
    | *** Errors: 1
    | In module random_09871
    | Could not parse module random_09871 from file random_09871.tla
    3002:1 Parsing or semantic analysis failed.
---*)
