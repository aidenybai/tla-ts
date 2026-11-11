(*---
description: Evaluates a random set expression, seed 262, number 3101.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03101 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4947 \in ({IF FALSE THEN 3 ELSE b4948 : b4948 \in ({1, 2} \cap 1..3)} \cap {b4949 \in (0 .. 3) : (<<1>> = (1 :> 2))}) |-> (CASE ({x \in 1..3 : x > 1} = 1..3) -> (2147483647 * 1) [] OTHER -> IF FALSE THEN {2, 1, 3} ELSE b4947 * (-(2147483647 \div -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 259 to line 14, col 262 of module random_03101 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 248.
    | Expression starting at line 14, column 248.
    | ExtendableExpr starting at line 14, column 247.
    | Expression starting at line 14, column 246.
    | ExtendableExpr starting at line 14, column 245.
    | Fatal errors while parsing TLA+ spec in file random_03101
    | In module random_03101
    | Could not parse module random_03101 from file random_03101.tla
    | *** Errors: 1
    | In module random_03101
    | Could not parse module random_03101 from file random_03101.tla
    3002:1 Parsing or semantic analysis failed.
---*)
