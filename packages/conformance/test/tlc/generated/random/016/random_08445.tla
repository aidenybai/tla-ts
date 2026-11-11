(*---
description: Evaluates a random set expression, seed 262, number 8445.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08445 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13070 \in (LET b13071 == (CHOOSE b13072 \in {} : TRUE) IN CASE FALSE -> b13071 [] OTHER -> b13071 .. CASE (~FALSE) -> (7 \div -1) [] OTHER -> (1 \div 2)) : (CASE (FALSE \/ FALSE) -> IF FALSE THEN b13070 ELSE b13070 [] OTHER -> (b13070 * 1) \in {Len(<<3, 1, 2>>) : b13073 \in ({} \ Nat)})})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 139 to line 14, col 142 of module random_08445 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 137.
    | Expression starting at line 14, column 137.
    | ExtendableExpr starting at line 14, column 136.
    | Expression starting at line 14, column 136.
    | Case Arm starting at line 14, column 124.
    | Fatal errors while parsing TLA+ spec in file random_08445
    | In module random_08445
    | Could not parse module random_08445 from file random_08445.tla
    | *** Errors: 1
    | In module random_08445
    | Could not parse module random_08445 from file random_08445.tla
    3002:1 Parsing or semantic analysis failed.
---*)
