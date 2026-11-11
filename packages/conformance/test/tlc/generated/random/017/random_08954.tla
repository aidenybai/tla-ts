(*---
description: Evaluates a random int expression, seed 262, number 8954.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08954 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b13892 == (<<3, 1, 2>>).a IN Head(<<1, 2>>) + ((1 % 0) .. IF FALSE THEN 7 ELSE 7)) * (((CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE) @@ (1 :> 0)))[(CASE TRUE -> 2 [] OTHER -> 2147483647 \div (7 * -1))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 218 to line 14, col 218 of module random_08954 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 216.
    | Expression starting at line 14, column 216.
    | ExtendableExpr starting at line 14, column 215.
    | ExtendableExpr starting at line 14, column 199.
    | Expression starting at line 14, column 199.
    | Fatal errors while parsing TLA+ spec in file random_08954
    | In module random_08954
    | Could not parse module random_08954 from file random_08954.tla
    | *** Errors: 1
    | In module random_08954
    | Could not parse module random_08954 from file random_08954.tla
    3002:1 Parsing or semantic analysis failed.
---*)
