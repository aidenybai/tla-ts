(*---
description: Evaluates a random record expression, seed 262, number 1439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b2303 == CASE (7 = 3) -> (3 * -1) [] OTHER -> ([x \in Nat |-> x + 1])[1] IN (IF TRUE THEN 3 ELSE b2303 - (-b2303)), b |-> ({b2304 \in {b2305 \in {1} : TRUE} : (\E b2306 \in {2, 1, 3} : <<1, 2>>)} = (Head(<<>>) .. (2 % 3)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 55 to line 14, col 55 of module random_01439 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 53.
    | Expression starting at line 14, column 53.
    | ExtendableExpr starting at line 14, column 52.
    | Expression starting at line 14, column 52.
    | Case Arm starting at line 14, column 41.
    | Fatal errors while parsing TLA+ spec in file random_01439
    | In module random_01439
    | Could not parse module random_01439 from file random_01439.tla
    | *** Errors: 1
    | In module random_01439
    | Could not parse module random_01439 from file random_01439.tla
    3002:1 Parsing or semantic analysis failed.
---*)
