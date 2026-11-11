(*---
description: Ported from TLC's AliasSafetyPropTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/AliasSafetyPropTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY SafetyProp
  ALIAS YAlias
args:
  - -deadlock
---*)







---- MODULE Alias ----
EXTENDS Integers, TLC, Sequences, TLCExt

VARIABLES x, y
vars == <<x,y>>

A ==
/\ y' = ~y
/\ x < 4
/\ x' = x + 1

B ==
/\ y' = ~y
/\ x = 4
/\ x' = 1             

Next == A \/ B

Spec == x = 1 /\ y = FALSE /\ [][Next]_vars

FairSpec == Spec /\ WF_vars(Next)

Inv == x < 4

Prop == <>(x > 4)

Animation(e1,e2) == "e1: " \o ToString(e1) \o " e2: " \o ToString(e2)

\* An expression that is evaluated on the pair of states
\* s and t and printed in place of s in an error trace.
\* Useful to:
\* - filter out variables (not shown below)
\* - rename variables
\* - map variables (e.g. animation)
\* - additional trace expressions
\* TLC ignores the original state if the evaluation of
\* Alias fails.
Alias == IF TLCGet("config").mode = "simulate" THEN
         [y |-> y, \* x and y reordered.
          x |-> x, 
          a |-> x' - x, 
          b |-> x' = x,
          anim |-> Animation(x, y), \* Animation
          te |-> ENABLED Next,      \* Trace Expression
          TLCGetAction |-> TLCGet("action"),
          lvl |-> [ i \in {1,2} |-> TLCGet("level")]]
         ELSE IF TLCGet("spec").impliedtemporals # {} THEN
         [yy |-> y, \* x and y reordered.
          x |-> x, 
          a |-> x' - x, 
          b |-> x' = x,
          anim |-> Animation(x, y), \* Animation
          te |-> ENABLED Next,      \* Trace Expression
          lvl |-> [ i \in {1,2} |-> TLCGet("level")],
          trc |-> Trace]
         ELSE
         [yy |-> y, \* x and y reordered.
          x |-> x, 
          a |-> x' - x, 
          b |-> x' = x,
          anim |-> Animation(x, y), \* Animation
          te |-> ENABLED Next,      \* Trace Expression
          lvl |-> [ i \in {1,2} |-> TLCGet("level")]]

\* Omits x, which Prop refers to.
YAlias == [y |-> y]

\* Violated by the step from x = 3 to x = 4. TLC finds the violation in the
\* behavior graph, like a safety property.
SafetyProp == [](x >= 3 => [](x < 4))

PostCondition ==
	/\ TLCGet("config").mode = "bfs" => TLCSet(42, TLCGet("generated"))
  	/\ CounterExample = 
  	   IF TLCGet("config").mode = "simulate" THEN
  	   	[ action |->
	      { << << 1,
	              [ x |-> 1,
	                y |-> FALSE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 1 e2: FALSE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "UnnamedAction",
	                      location |->
	                          [ beginLine |-> 26,
	                            beginColumn |-> 18,
	                            endLine |-> 26,
	                            endColumn |-> 26,
	                            module |-> "Alias" ] ],
	                lvl |-> <<1, 1>> ] >>,
	           [ name |-> "A",
	             location |->
	                 [ beginLine |-> 15,
	                   beginColumn |-> 1,
	                   endLine |-> 17,
	                   endColumn |-> 13,
	                   module |-> "Alias" ] ],
	           << 2,
	              [ x |-> 2,
	                y |-> TRUE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 2 e2: TRUE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<2, 2>> ] >> >>,
	        << << 2,
	              [ x |-> 2,
	                y |-> TRUE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 2 e2: TRUE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<2, 2>> ] >>,
	           [ name |-> "A",
	             location |->
	                 [ beginLine |-> 15,
	                   beginColumn |-> 1,
	                   endLine |-> 17,
	                   endColumn |-> 13,
	                   module |-> "Alias" ] ],
	           << 3,
	              [ x |-> 3,
	                y |-> FALSE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 3 e2: FALSE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<3, 3>> ] >> >>,
	        << << 3,
	              [ x |-> 3,
	                y |-> FALSE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 3 e2: FALSE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<3, 3>> ] >>,
	           [ name |-> "A",
	             location |->
	                 [ beginLine |-> 15,
	                   beginColumn |-> 1,
	                   endLine |-> 17,
	                   endColumn |-> 13,
	                   module |-> "Alias" ] ],
	           << 4,
	              [ x |-> 4,
	                y |-> TRUE,
	                a |-> 0,
	                b |-> TRUE,
	                anim |-> "e1: 4 e2: TRUE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<4, 4>> ] >> >> },
		  state |->
		      { << 1,
		           [ x |-> 1,
		             y |-> FALSE,
		             a |-> 1,
		             b |-> FALSE,
		             anim |-> "e1: 1 e2: FALSE",
		             te |-> TRUE,
		             TLCGetAction |->
		                 [ name |-> "UnnamedAction",
		                   location |->
		                       [ beginLine |-> 26,
		                         beginColumn |-> 18,
		                         endLine |-> 26,
		                         endColumn |-> 26,
		                         module |-> "Alias" ] ],
		             lvl |-> <<1, 1>> ] >>,
		        << 2,
		           [ x |-> 2,
		             y |-> TRUE,
		             a |-> 1,
		             b |-> FALSE,
		             anim |-> "e1: 2 e2: TRUE",
		             te |-> TRUE,
		             TLCGetAction |->
		                 [ name |-> "A",
		                   location |->
		                       [ beginLine |-> 15,
		                         beginColumn |-> 1,
		                         endLine |-> 17,
		                         endColumn |-> 13,
		                         module |-> "Alias" ] ],
		             lvl |-> <<2, 2>> ] >>,
		        << 3,
		           [ x |-> 3,
		             y |-> FALSE,
		             a |-> 1,
		             b |-> FALSE,
		             anim |-> "e1: 3 e2: FALSE",
		             te |-> TRUE,
		             TLCGetAction |->
		                 [ name |-> "A",
		                   location |->
		                       [ beginLine |-> 15,
		                         beginColumn |-> 1,
		                         endLine |-> 17,
		                         endColumn |-> 13,
		                         module |-> "Alias" ] ],
		             lvl |-> <<3, 3>> ] >>,
		        << 4,
		           [ x |-> 4,
		             y |-> TRUE,
		             a |-> 0,
		             b |-> TRUE,
		             anim |-> "e1: 4 e2: TRUE",
		             te |-> TRUE,
		             TLCGetAction |->
		                 [ name |-> "A",
		                   location |->
		                       [ beginLine |-> 15,
		                         beginColumn |-> 1,
		                         endLine |-> 17,
		                         endColumn |-> 13,
		                         module |-> "Alias" ] ],
		             lvl |-> <<4, 4>> ] >> } ]
  	   ELSE
		[ action |->
            { << << 1,
                    [ x |-> 1,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 1 e2: FALSE",
                      te |-> TRUE,
                      lvl |-> <<1, 1>>,
		                yy |-> FALSE ] >>,
                [ name |-> "A",
                  location |->
                      [ beginLine |-> 15,
                        beginColumn |-> 1,
                        endLine |-> 17,
                        endColumn |-> 13,
                        module |-> "Alias" ] ],
                << 2,
                    [ x |-> 2,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 2 e2: TRUE",
                      te |-> TRUE,
                      lvl |-> <<2, 2>>,
		                yy |-> TRUE ] >> >>,
              << << 2,
                    [ x |-> 2,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 2 e2: TRUE",
                      te |-> TRUE,
                      lvl |-> <<2, 2>>,
		                yy |-> TRUE ] >>,
                [ name |-> "A",
                  location |->
                      [ beginLine |-> 15,
                        beginColumn |-> 1,
                        endLine |-> 17,
                        endColumn |-> 13,
                        module |-> "Alias" ] ],
                << 3,
                    [ x |-> 3,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 3 e2: FALSE",
                      te |-> TRUE,
                      lvl |-> <<3, 3>>,
		                yy |-> FALSE ] >> >>,
              << << 3,
                    [ x |-> 3,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 3 e2: FALSE",
                      te |-> TRUE,
                      lvl |-> <<3, 3>>,
		                yy |-> FALSE ] >>,
                [ name |-> "A",
                  location |->
                      [ beginLine |-> 15,
                        beginColumn |-> 1,
                        endLine |-> 17,
                        endColumn |-> 13,
                        module |-> "Alias" ] ],
		           << 4,
		              [ x |-> 4,
		                a |-> 0,
		                b |-> TRUE,
		                anim |-> "e1: 4 e2: TRUE",
		                te |-> TRUE,
		                lvl |-> <<4, 4>>,
		                yy |-> TRUE ] >> >> },
	        state |->
	            { << 1,
	                [ x |-> 1,
	                  a |-> 1,
	                  b |-> FALSE,
	                  anim |-> "e1: 1 e2: FALSE",
	                  te |-> TRUE,
	                  lvl |-> <<1, 1>>,
		             yy |-> FALSE ] >>,
	              << 2,
	                [ x |-> 2,
	                  a |-> 1,
	                  b |-> FALSE,
	                  anim |-> "e1: 2 e2: TRUE",
	                  te |-> TRUE,
	                  lvl |-> <<2, 2>>,
		             yy |-> TRUE ] >>,
	              << 3,
	                [ x |-> 3,
	                  a |-> 1,
	                  b |-> FALSE,
	                  anim |-> "e1: 3 e2: FALSE",
	                  te |-> TRUE,
	                  lvl |-> <<3, 3>>,
		             yy |-> FALSE ] >>,
		        << 4,
		           [ x |-> 4,
		             a |-> 0,
		             b |-> TRUE,
		             anim |-> "e1: 4 e2: TRUE",
		             te |-> TRUE,
		             lvl |-> <<4, 4>>,
		             yy |-> TRUE ] >> } ]
	
PostConditionLasso ==
  	/\ IF CounterExample.state = {} THEN TRUE ELSE CounterExample = 
			[ action |->
			      { << <<1, [x |-> 1, y |-> FALSE]>>,
			           [ name |-> "A",
			             location |->
			                 [ beginLine |-> 15,
			                   beginColumn |-> 1,
			                   endLine |-> 17,
			                   endColumn |-> 13,
			                   module |-> "Alias" ] ],
			           <<2, [x |-> 2, y |-> TRUE]>> >>,
			        << <<2, [x |-> 2, y |-> TRUE]>>,
			           [ name |-> "A",
			             location |->
			                 [ beginLine |-> 15,
			                   beginColumn |-> 1,
			                   endLine |-> 17,
			                   endColumn |-> 13,
			                   module |-> "Alias" ] ],
			           <<3, [x |-> 3, y |-> FALSE]>> >>,
			        << <<3, [x |-> 3, y |-> FALSE]>>,
			           [ name |-> "A",
			             location |->
			                 [ beginLine |-> 15,
			                   beginColumn |-> 1,
			                   endLine |-> 17,
			                   endColumn |-> 13,
			                   module |-> "Alias" ] ],
			           <<4, [x |-> 4, y |-> TRUE]>> >>,
			        << <<4, [x |-> 4, y |-> TRUE]>>,
			           [ name |-> "B",
			             location |->
			                 [ beginLine |-> 20,
			                   beginColumn |-> 1,
			                   endLine |-> 22,
			                   endColumn |-> 9,
			                   module |-> "Alias" ] ],
			           <<1, [x |-> 1, y |-> FALSE]>> >> },
			  state |->
			      { <<1, [x |-> 1, y |-> FALSE]>>,
			        <<2, [x |-> 2, y |-> TRUE]>>,
			        <<3, [x |-> 3, y |-> FALSE]>>,
			        <<4, [x |-> 4, y |-> TRUE]>> } ]

Tautology == (vars = vars) ~> (vars = vars)

PostConditionStuttering ==
  	/\ IF CounterExample.state = {} THEN TRUE ELSE CounterExample = 
			[ action |->
			      { << <<1, [x |-> 1, y |-> FALSE]>>,
			           [ name |-> "UnnamedAction",
			             location |->
			                 [ beginLine |-> 26,
			                   beginColumn |-> 18,
			                   endLine |-> 26,
			                   endColumn |-> 26,
			                   module |-> "Alias" ] ],
			           <<1, [x |-> 1, y |-> FALSE]>> >> },
			  state |->
			      { <<1, [x |-> 1, y |-> FALSE]>> } ]

=======================

---- CONFIG Alias ----
SPECIFICATION FairSpec
INVARIANT Inv
ALIAS Alias
POSTCONDITION PostCondition
======================


\* FairSpec => []Inv
Error: Invariant Inv is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ y = FALSE
/\ x = 1
/\ a = 1
/\ b = FALSE

State 2: <Action line 11, col 34 to line 11, col 46 of module Alias>
/\ y = TRUE
/\ x = 2
/\ a = 1
/\ b = FALSE

State 3: <Action line 11, col 34 to line 11, col 46 of module Alias>
/\ y = FALSE
/\ x = 3
/\ a = 1
/\ b = FALSE

State 4: <Action line 11, col 34 to line 11, col 46 of module Alias>
/\ y = TRUE
/\ x = 4
/\ a = 0     \* Stuttering
/\ b = TRUE  \* Stuttering

-------------------------------
\* Spec => Prop
Error: Temporal properties were violated.
Error: The following behavior constitutes a counter-example:

State 1: <Initial predicate>
/\ y = FALSE
/\ x = 1
/\ a = 0     \* Stuttering
/\ b = TRUE  \* Stuttering

State 2: Stuttering

-------------------------------
\* FairSpec => Prop
Error: Temporal properties were violated.
Error: The following behavior constitutes a counter-example:

State 1: <Initial predicate>
/\ y = FALSE
/\ x = 1
/\ a = 1
/\ b = FALSE

State 2: <Next line 17, col 9 to line 21, col 23 of module Alias>
/\ y = TRUE
/\ x = 2
/\ a = 1
/\ b = FALSE

State 3: <Next line 17, col 9 to line 21, col 23 of module Alias>
/\ y = FALSE
/\ x = 3
/\ a = 1
/\ b = FALSE

State 4: <Next line 17, col 9 to line 21, col 23 of module Alias>
/\ y = TRUE
/\ x = 4
/\ a = -3      \* State 1 is successor
/\ b = FALSE   \* State 1 is successor

Back to state 1: <Next line 17, col 9 to line 21, col 23 of module Alias>

-------------------------------

(*--- recorded
all:
  exit: 12
  transcript: |-
    | line 387, col 42 to line 387, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 387, col 51 to line 387, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 395, col 42 to line 395, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 395, col 51 to line 395, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 396, col 42 to line 396, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 396, col 51 to line 396, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 404, col 42 to line 404, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 404, col 51 to line 404, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 405, col 42 to line 405, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 405, col 51 to line 405, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 413, col 42 to line 413, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 413, col 51 to line 413, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 414, col 42 to line 414, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 414, col 51 to line 414, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 422, col 42 to line 422, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 422, col 51 to line 422, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 424, col 39 to line 424, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 424, col 48 to line 424, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 425, col 39 to line 425, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 425, col 48 to line 425, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 426, col 39 to line 426, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 426, col 48 to line 426, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 427, col 39 to line 427, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 427, col 48 to line 427, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 434, col 42 to line 434, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 434, col 51 to line 434, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 442, col 42 to line 442, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 442, col 51 to line 442, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 444, col 39 to line 444, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 24, col 11 to line 24, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 444, col 48 to line 444, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 24, col 14 to line 24, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property SafetyProp was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    y = FALSE
    2217:4 2: <A line 28, col 1 to line 30, col 13 of module Alias>
    y = TRUE
    2217:4 3: <A line 28, col 1 to line 30, col 13 of module Alias>
    y = FALSE
    2217:4 4: <A line 28, col 1 to line 30, col 13 of module Alias>
    y = TRUE
    2199:0 5 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
