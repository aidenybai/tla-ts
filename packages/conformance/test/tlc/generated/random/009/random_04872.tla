(*---
description: Evaluates a random int expression, seed 262, number 4872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7588 == Len(<<0, 2>>) IN CASE (2..1 = {2, 1, 3}) -> LET b7589 == 1 IN -1 [] OTHER -> (b7588 - 0) \div LET b7590 == CASE (3 = 7) -> (2 % 2147483647) [] OTHER -> (<<3, 1, 2>> \div -1) IN (CHOOSE b7591 \in UNION {{}, {2, 1, 3}} : ({x \in 1..3 : x > 1} = Nat))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 195 to line 14, col 198 of module random_04872 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 183.
    | Expression starting at line 14, column 183.
    | ExtendableExpr starting at line 14, column 182.
    | Expression starting at line 14, column 182.
    | Case Other Arm starting at line 14, column 173.
    | Fatal errors while parsing TLA+ spec in file random_04872
    | In module random_04872
    | Could not parse module random_04872 from file random_04872.tla
    | *** Errors: 1
    | In module random_04872
    | Could not parse module random_04872 from file random_04872.tla
    3002:1 Parsing or semantic analysis failed.
---*)
