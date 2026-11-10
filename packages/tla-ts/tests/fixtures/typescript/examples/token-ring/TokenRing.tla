--------------------------------- MODULE TokenRing ---------------------------------
(***********************************************************************************)
(* Dijkstra's classical stabilizing token ring algorithm: EWD426                   *)
(* https://muratbuffalo.blogspot.com/2015/01/dijkstras-stabilizing-token-ring.html *)
(***********************************************************************************)
EXTENDS Naturals, FiniteSets

CONSTANTS  N, M
ASSUME NAssumption == N \in Nat \ {0} \* At least one node
ASSUME MAssumption == M \in Nat \ {0} \* Value domain of c 

ASSUME NMAssumption == N <= M + 1

Node == 0 .. N-1

VARIABLES 
    c   \* counter at each node, token is defined as function of c's in nbring nodes

vars == << c >>    

TypeOK ==
    /\ c \in [ Node -> 0 .. M-1 ]
------------------------------------------------------------------------------------

Init ==
    /\ c \in [ Node -> 0 .. M-1 ]

CreateToken ==
    (* Node 0 executes this action to inject new value into system *)
    /\ c [0] = c [N-1]
    /\ c' = [ c EXCEPT ![0] = (c[N-1]+ 1) % M ]

PassToken(i) ==
    (* Other nodes just copy value of the predecessor *)
    /\ i # 0
    /\ c [i] # c [i-1]
    /\ c' = [ c EXCEPT ![i] = c[i-1]]    

---------------------------------------------------------------------------------------
Next == 
    \/ CreateToken
    \/ \E i \in Node \ {0} : PassToken(i)

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)    

---------------------------------------------------------------------------------------
UniqueToken ==
    \E i \in 0 .. N :                           \* unique token at i (or i=N => token is at 0)
       /\ \A j \in 0..i-1: c[j]= c[0]           \* before i all c equals c[0] 
       /\ \A j \in i..N-1: c[j]= (c[0]-1) % M   \* after i all c following c[0]

(* Stabilization property *)
Stab  == <>[]UniqueToken

---------------------------------------------------------------------------------------

Alias ==
    [
        counter|-> c,
        unique |-> UniqueToken
    ]

=======================================================================================
