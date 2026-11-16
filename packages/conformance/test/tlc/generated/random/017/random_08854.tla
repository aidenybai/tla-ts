(*---
description: Evaluates a random set expression, seed 262, number 8854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b13717 \in {b13718 \in Nat : [x \in 1..2 |-> x]} : (\A b13719 \in Nat : FALSE)} \ ((2 * -1) .. CASE TRUE -> 7 [] OTHER -> 0)) \cap {(([a |-> 1]).a \div (2147483647 * 0)), (-CASE FALSE -> 1 [] OTHER -> 1)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 105 to line 14, col 105 of module random_08854 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 103.
    | Expression starting at line 14, column 103.
    | ExtendableExpr starting at line 14, column 102.
    | Expression starting at line 14, column 102.
    | ExtendableExpr starting at line 14, column 101.
    | Fatal errors while parsing TLA+ spec in file random_08854
    | In module random_08854
    | Could not parse module random_08854 from file random_08854.tla
    | *** Errors: 1
    | In module random_08854
    | Could not parse module random_08854 from file random_08854.tla
    3002:1 Parsing or semantic analysis failed.
---*)
