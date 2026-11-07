(*---
description: Evaluates a random record expression, seed 262, number 581.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00581 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + (CHOOSE b980 \in Nat : TRUE)] EXCEPT !.a = @ + (Head(<<>>) * (1 % 2))] EXCEPT !.a = @ + ((CASE FALSE -> 7 [] OTHER -> 2 + IF FALSE THEN 3 ELSE 0) * (UNION {1..3, {2, 1, 3}} * [[a |-> 1] EXCEPT !.a = @ + TRUE]))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 218 to line 14, col 222 of module random_00581 and *.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 224.
    | Expression starting at line 14, column 218.
    | ExtendableExpr starting at line 14, column 217.
    | ExtendableExpr starting at line 14, column 158.
    | Expression starting at line 14, column 158.
    | Fatal errors while parsing TLA+ spec in file random_00581
    | In module random_00581
    | Could not parse module random_00581 from file random_00581.tla
    | *** Errors: 1
    | In module random_00581
    | Could not parse module random_00581 from file random_00581.tla
    3002:1 Parsing or semantic analysis failed.
---*)
