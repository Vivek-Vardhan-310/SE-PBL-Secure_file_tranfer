#include <stdio.h>
#include <stdlib.h>
struct node
{
   int data;
   struct node *next;
};
struct node *head=NULL;
struct node* createnode()
{
    struct node *temp;
    temp=(struct node*)calloc(1,sizeof(struct node));
    if(temp!=NULL)
    {
        int ele;
        printf("enter the value of ele:-\n");
        scanf("%d",&ele);
        temp->data=ele;
        temp->next=NULL;
        printf("node is created\n");
    }
    else
    {
        printf("insufficient memory");
    }
    return temp;
}

void createlist()
{
    struct node *newnode,*ptr;
    int N,i;
    printf("enter no.of nodes\n");
    scanf("%d",&N);
    for(i=0;i<N;i+=1)
    {
       newnode = createnode();
       if(head==NULL)
       {
          head=newnode;
          ptr=head;
       }
       else
       {
          ptr->next=newnode;
          ptr=newnode;
       }
    }
    printf("list is created\n");
}
void displaylist()
{
    struct node *ptr;
    if(head==NULL)
    {
      printf("node is empty!!\n");
    }
    else
    {
        ptr=head;
        while(ptr!=NULL)
        {
           printf("%d->",ptr->data);
           ptr=ptr->next;
        }
        printf("\n");
    }
}

int countnode()
{
    struct node *ptr;
    int count=0;
    if(head==NULL)
    {
        return count;
    }
    else
    {
       ptr=head;
       while(ptr!=NULL)
       {
        count+=1;
        ptr=ptr->next;
       }
       return count;
    }
}

void deleteATpos()
{
    struct node *ptr,*ptr1;
    int count,pos,i;
    count=countnode();
    printf("enter the position to delete node");
    scanf("%d",&pos);
    if(pos>=0&&pos<=count)
    {
    if(head==NULL)
    {
       printf("list is empty!!");
    }
    else if(head->next==NULL&&pos==0)
    {
       ptr=head;
       head=NULL;
       printf("deleted element is %d",ptr->data);
       free(ptr);
    }
    else if(head->next!=NULL&&pos==0)
    {
       ptr=head;
       head=head->next;
       printf("deleted element is %d",ptr->data);
       ptr->next=NULL;
       free(ptr);
    }
    else 
    {
       ptr=head;
       for(i=0;i<pos-1;i+=1)
       {
        ptr=ptr->next;
       }
       ptr1=ptr->next;
       printf("deleted element is %d",ptr1->data);
       ptr->next=ptr1->next;
       ptr1->next=NULL;
       free(ptr1);
    }
    }
    else
    {
        printf("invalid position\n");
    }
    printf("new list:-\n");
    displaylist();
}

int main()
{
    int op;
    createlist();
    displaylist();
    printf("1.delete\n2.EXIT\n");
    while(1)
    {
        printf("enter option:-\n");
        scanf("%d",&op);
        switch (op)
        {
        case 1: deleteATpos();
            break;
        case 2: exit(0);
        break;
        default:printf("enter valid option\n");
            break;
        }
    }
    return 0;
}