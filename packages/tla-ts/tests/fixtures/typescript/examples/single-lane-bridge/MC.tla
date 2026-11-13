---- MODULE MC ----
\* MC.tla in tlaplus/Examples checks two cars on the left and eight positions, which takes over 5 s,
\* so this checks one car on the left and six positions.
EXTENDS SingleLaneBridge, TLC

\* CONSTANT definitions @modelParameterConstants:0CarsRight
const_1615720459299211000 == 
{"r1","r2"}
----

\* CONSTANT definitions @modelParameterConstants:1CarsLeft
const_1615720459299212000 == 
{"l1"}
----

\* CONSTANT definitions @modelParameterConstants:2Bridge
const_1615720459299213000 == 
{3,4}
----

\* CONSTANT definitions @modelParameterConstants:3Positions
const_1615720459299214000 == 
{1,2,3,4,5,6}
----

=============================================================================
\* Modification History
\* Last modified Sun Oct 10 22:023:42 CEST 2021 by youne
